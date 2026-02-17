import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import SpinnerIcon from "../../../components/svgs/SpinnerIcon";
import { getPlayersDropdown } from "../../../slices/playerSlice";
import { useEffect } from "react";
import CommonInput from "../../../components/form/CommonInput";
import {
  createGameActivation,
  getGameActivationDropdown,
  getGroupedActivations,
  resetApiStateFromGameActivation,
} from "../../../slices/gameActivationSlice";
import useApiResponseHandler from "../../../hooks/useApiResponseHandler";
import AntSearchableSelector from "../../../components/form/AntDesign/AntSearchableSelector";

const CreateGameActivationModal = ({
  open = true,
  onClose,
  title = "Create Ticket",
  hideQuantity = false,
}) => {
  const form = useForm({
    defaultValues: {
      gameId: "",
      playerId: "",
      vendor: "",
      quantity: 1,
    },
  });
  const { control, register, handleSubmit, formState, setError, reset } = form;
  const { errors } = formState;
  const dispatch = useDispatch();
  const { createGameActivationApi, getGameActivationDropdownApi } = useSelector(
    (state) => state.gameActivation
  );
  const apiResponse = getGameActivationDropdownApi?.data?.response;
  const games =
    apiResponse?.map((g) => ({ value: g._id, label: g.title })) || [];
  const { getPlayersDropdownApi } = useSelector((state) => state.player);

  const players =
    getPlayersDropdownApi.data?.response?.map((p) => ({
      value: p.playerId,
      label: p.name,
    })) || [];

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      quantity: hideQuantity ? 1 : Number(data.quantity || 1),
    };
    dispatch(createGameActivation(payload));
  };

  useEffect(() => {
    dispatch(getPlayersDropdown());
    dispatch(getGameActivationDropdown());
  }, [dispatch]);

  useApiResponseHandler({
    status: createGameActivationApi.status,
    data: createGameActivationApi.data,
    error: createGameActivationApi.error,
    resetForm: () => reset({ playerId: "", gameId: "", quantity: 1 }),
    resetReduxStatus: () =>
      dispatch(resetApiStateFromGameActivation("createGameActivationApi")),
    setFormError: setError,
    sideAction: () => {
      dispatch(getGroupedActivations({ page: 1 }));
      onClose && onClose();
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={onClose}
      title={<span className="text-2xl">{title}</span>}
      contentClassName="min-w-[90%] lg:min-w-[840px] min-h-[70vh] overflow-y-auto overflow-x-clip"
      className="overflow-y-scroll scrollbar-hide text-blue min-h-[200px]"
      showClose
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="p-4 flex flex-col gap-4 items-end min-h-[400px]"
      >
        {!hideQuantity && (
          <CommonInput
            labelName="Vendor"
            id="vendor"
            name="vendor"
            type="text"
            register={register}
            errors={errors}
          />
        )}
        <AntSearchableSelector
          id="playerId"
          name="playerId"
          labelName="Select Players"
          options={players}
          control={control}
          errors={errors}
        />

        <AntSearchableSelector
          id="gameId"
          name="gameId"
          labelName="Select Games"
          options={games}
          control={control}
          errors={errors}
        />

        {!hideQuantity && (
          <CommonInput
            labelName="Quantity"
            id="quantity"
            name="quantity"
            type="number"
            register={register}
            required
            errors={errors}
          />
        )}

        <Button type="submit" className="w-fit">
          {"Create"}
          {createGameActivationApi.isLoading && <SpinnerIcon />}
        </Button>
      </form>
    </Modal>
  );
};

export default CreateGameActivationModal;
